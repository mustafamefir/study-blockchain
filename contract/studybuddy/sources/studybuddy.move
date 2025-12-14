// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Study Buddy Contract
/// A shared object for managing studybuddy.
/// Rules:
/// - anyone can create and share a studybuddy
/// - owner can add items
/// - owner can remove items
/// - owner can query count
module studybuddy::contract {
  /// A shared studybuddy object.
  public struct Studybuddy has key {
    id: UID,
    owner: address,
    session_count: u64
  }

  /// Create and share a Studybuddy object.
  public fun create(ctx: &mut TxContext) {
    transfer::share_object(Studybuddy {
      id: object::new(ctx),
      owner: ctx.sender(),
      session_count: 0
    })
  }

  /// Add an item (only owner can add)
  public fun add_session(manager: &mut Studybuddy, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    manager.session_count = manager.session_count + 1;
  }

  /// Remove an item (only owner can remove)
  public fun remove_session(manager: &mut Studybuddy, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    assert!(manager.session_count > 0, 1);
    manager.session_count = manager.session_count - 1;
  }

  /// Get count
  public fun get_session_count(manager: &Studybuddy): u64 {
    manager.session_count
  }
}
